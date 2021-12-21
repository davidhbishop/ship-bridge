import os
import asyncio
import datetime
from azure.iot.device.aio import IoTHubDeviceClient
from azure.iot.device.aio import ProvisioningDeviceClient
from azure.iot.device import MethodResponse
import pnp_helper


class SenseClient(object):
    def __init__(self):
        self.sensors_component_schema = "dtmi:azureiot:PhoneSensors;1"
        self.info_component_schema = "dtmi:azureiot:DeviceManagement:DeviceInformation;1"
        self.device_schema = "dtmi:azureiot:PhoneAsADevice;2"
        self.sensors_component_name = "sensors"
        self.info_component_name = "deviceInformation"
        self.serial_number = "0000"

        self.provisioning_host = os.getenv("IOTHUB_DEVICE_DPS_ENDPOINT")
        self.id_scope = os.getenv("IOTHUB_DEVICE_DPS_ID_SCOPE")
        self.registration_id = os.getenv("IOTHUB_DEVICE_DPS_DEVICE_ID")
        self.symmetric_key = os.getenv("IOTHUB_DEVICE_DPS_DEVICE_KEY")

        self.device_client = None
        self.listeners = None
        self.sensor = None

    def set_sensor(self,sensor):
        self.sensor = sensor

    async def provision_device(self):
        provisioning_device_client = ProvisioningDeviceClient.create_from_symmetric_key(
            provisioning_host=self.provisioning_host,
            registration_id=self.registration_id,
            id_scope=self.id_scope,
            symmetric_key=self.symmetric_key,
        )

        provisioning_device_client.provisioning_payload = {"modelId": self.device_schema}
        registration_result = await provisioning_device_client.register()

        if registration_result.status == "assigned":
            print("Device was assigned")
            print(registration_result.registration_state.assigned_hub)
            print(registration_result.registration_state.device_id)
            self.device_client = IoTHubDeviceClient.create_from_symmetric_key(
                symmetric_key=self.symmetric_key,
                hostname=registration_result.registration_state.assigned_hub,
                device_id=registration_result.registration_state.device_id,
                product_info=self.device_schema,
            )
        else:
            raise RuntimeError(
                "Could not provision device. Aborting Plug and Play device connection."
            )

    async def connect(self):
        await self.device_client.connect()

    def update_properties(self):
        properties_root = pnp_helper.create_reported_properties(serialNumber=self.serial_number)
        properties_thermostat1 = pnp_helper.create_reported_properties(
            self.sensors_component_name, maxTempSinceLastReboot=98.34
        )
        properties_device_info = pnp_helper.create_reported_properties(
            self.info_component_name,
            swVersion="1.0",
            manufacturer="Raspberry",
            model="3B+",
            osName="Linux",
            processorArchitecture="x86-64",
            processorManufacturer="ARM",
            totalStorage=1024,
            totalMemory=32,
        )

        property_updates = asyncio.gather(
            self.device_client.patch_twin_reported_properties(properties_root),
            self.device_client.patch_twin_reported_properties(properties_thermostat1),
            self.device_client.patch_twin_reported_properties(properties_device_info),
        )

        return property_updates

    async def send_telemetry_from_temp_controller(self,
                                                  telemetry_msg,
                                                  component_name=None):
        msg = pnp_helper.create_telemetry(telemetry_msg, component_name)
        await self.device_client.send_message(msg)
        print("Sent message")
        print(msg)
        await asyncio.sleep(5)

    async def execute_command_listener(self,
                                       component_name=None,
                                       method_name=None,
                                       user_command_handler=None,
                                       create_user_response_handler=None,
                                       ):
        """
        Coroutine for executing listeners. These will listen for command requests.
        They will take in a user provided handler and call the user provided handler
        according to the command request received.
        :param device_client: The device client
        :param component_name: The name of the device like "sensor"
        :param method_name: (optional) The specific method name to listen for. Eg could be "blink", "turnon" etc.
        If not provided the listener will listen for all methods.
        :param user_command_handler: (optional) The user provided handler that needs to be executed after receiving "command requests".
        If not provided nothing will be executed on receiving command.
        :param create_user_response_handler: (optional) The user provided handler that will create a response.
        If not provided a generic response will be created.
        :return:
        """
        while True:
            if component_name and method_name:
                command_name = component_name + "*" + method_name
            elif method_name:
                command_name = method_name
            else:
                command_name = None

            command_request = await self.device_client.receive_method_request(command_name)
            print("Command request received with payload")
            values = command_request.payload
            print(values)

            if user_command_handler:
                await user_command_handler(values)
            else:
                print("No handler provided to execute")

            (response_status, response_payload) = pnp_helper.create_response_payload_with_status(
                command_request, method_name, create_user_response=create_user_response_handler
            )

            command_response = MethodResponse.create_from_method_request(
                command_request, response_status, response_payload
            )

            try:
                await self.device_client.send_method_response(command_response)
            except Exception:
                print("responding to the {command} command failed".format(command=method_name))

    async def execute_property_listener(self):
        while True:
            patch = await self.device_client.receive_twin_desired_properties_patch()  # blocking call
            print(patch)
            properties_dict = pnp_helper.create_reported_properties_from_desired(patch)

            await self.device_client.patch_twin_reported_properties(properties_dict)

    async def reboot_handler(self, values):
        if values:
            print("Rebooting after delay of {delay} secs".format(delay=values))
        print("Done rebooting")

    async def max_min_handler(self, values):
        if values:
            print(
                "Will return the max, min and average temperature from the specified time {since} to the current time".format(
                    since=values
                )
            )
        print("Done generating")

    def create_max_min_report_response(self, sensor_name):
        """
        An example function that can create a response to the "getMaxMinReport" command request the way the user wants it.
        Most of the times response is created by a helper function which follows a generic pattern.
        This should be only used when the user wants to give a detailed response back to the Hub.
        :param values: The values that were received as part of the request.
        """
        if "PhoneSensor;1" in sensor_name and self.sensor:
            response_dict = self.sensor.create_report()
        else:  # This is done to pass certification.
            response_dict = {}
            response_dict["maxTemp"] = 0
            response_dict["minTemp"] = 0
            response_dict["avgTemp"] = 0
            response_dict["startTime"] = datetime.now().astimezone().isoformat()
            response_dict["endTime"] = datetime.now().astimezone().isoformat()

        print(response_dict)
        return response_dict

    def start_listeners(self):
        self.listeners = asyncio.gather(
            self.execute_command_listener(
                method_name="reboot", user_command_handler=self.reboot_handler
            ),
            self.execute_command_listener(
                self.sensors_component_name,
                method_name="getMaxMinReport",
                user_command_handler=self.max_min_handler,
                create_user_response_handler=self.create_max_min_report_response,
            ),
            self.execute_command_listener(
                self.sensors_component_name,
                method_name="getMaxMinReport",
                user_command_handler=self.max_min_handler,
                create_user_response_handler=self.create_max_min_report_response,
            ),
            self.execute_property_listener(),
        )
        return self.listeners




