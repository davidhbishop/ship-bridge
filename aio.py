import aiohttp
import asyncio
import requests

from config import get_locations
from config import get_sources
from config import write_data

async def main(url):

    async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=False)) as session:
        header = {'Ocp-Apim-Subscription-Key':'e02bad75e2fd40139358632685fe3c18'}

        async with session.get(url,false,header) as response:

            print("Status:", response.status)
            print("Content-type:", response.headers['content-type'])

            html = await response.text()
            print("Body:", html, "...")

print('Start')



#loop = asyncio.get_event_loop()
#loop.run_until_complete(main(url))
print('Finished')