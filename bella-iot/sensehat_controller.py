# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import asyncio
import random
import logging
from senseclient import SenseClient
from thermostat import Thermostat

from datetime import timedelta, datetime

logging.basicConfig(level=logging.ERROR)


#####################################################
# GLOBAL VARIABLES
SENSOR = None
DEVICE = None

# END CREATE RESPONSES TO COMMANDS
#####################################################

#####################################################
# An # END KEYBOARD INPUT LISTENER to quit application


def stdin_listener():
    """
    Listener for quitting the sample
    """
    while True:
        selection = input("Press Q to quit\n")
        if selection == "Q" or selection == "q":
            print("Quitting...")
            break


# END KEYBOARD INPUT LISTENER
#####################################################


#####
#Main
# Load environment variables and provision device
# One assigned await for connection
# Update some properties
# Use asyncio.gather to run a collection of tasks at the same time
async def main():
    global DEVICE
    DEVICE = SenseClient()

    global SENSOR
    SENSOR = Thermostat(DEVICE.sensors_component_name, 10)

    DEVICE.set_sensor(SENSOR)

    # Provision and register the device
    await DEVICE.provision_device()

    # Connect the client.
    await DEVICE.connect()

    ################################################
    # Update readable properties from various components
    property_updates = DEVICE.update_properties()

    ################################################
    # Get all the listeners running
    print("Listening for command requests and property updates")
    listeners = DEVICE.start_listeners()

    ################################################
    # Function to send telemetry every 8 seconds

    async def send_telemetry():
        print("Sending telemetry from various components")

        while True:
            curr_temp_ext = random.randrange(10, 50)
            SENSOR.record(curr_temp_ext)

            sensor_msg = {"temperature": curr_temp_ext}
            await DEVICE.send_telemetry_from_temp_controller(
                sensor_msg,
                DEVICE.sensors_component_name
            )

    send_telemetry_task = asyncio.ensure_future(send_telemetry())

    # Run the stdin listener in the event loop
    loop = asyncio.get_running_loop()
    user_finished = loop.run_in_executor(None, stdin_listener)
    # # Wait for user to indicate they are done listening for method calls
    await user_finished

    if not listeners.done():
        listeners.set_result("DONE")

    if not property_updates.done():
        property_updates.set_result("DONE")

    listeners.cancel()
    property_updates.cancel()

    send_telemetry_task.cancel()

    # Finally, shut down the client
    await DEVICE.device_client.shutdown()


#####################################################
# EXECUTE MAIN

if __name__ == "__main__":
    asyncio.run(main())

    # If using Python 3.6 or below, use the following code instead of asyncio.run(main()):
    # loop = asyncio.get_event_loop()
    # loop.run_until_complete(main())
    # loop.close()
