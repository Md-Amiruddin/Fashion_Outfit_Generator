import json
import requests
import io
import base64
from PIL import Image, PngImagePlugin

url = "https://cd3261e592169b4559.gradio.live"

payload = {
    "hr_prompt": "xyzsankurta, (highly detailed:1.3), 1boy, solo,(full body:1.3), Ultra-detail, (highres:1.1), best quality,(masterpiece:1.3),chair, cinematic lighting, (highly detailed face and eyes:1.3), kurta, (shoes), <lora:xyzsankurta:.8>",
    "hr_negative_prompt": "(worst quality:2,low quality:2), (interlocked fingers, badly drawn hands and fingers, anatomically incorrect hands, googly eyes)",
    "prompt": "a man wearing dhoti kurta and sandals",
    "seed": 71545068,
    "steps": 50,
    "restore_faces": True,
}




response = requests.post(url=f'{url}/sdapi/v1/txt2img', json=payload)

try:
    response.raise_for_status()  # Raise an exception for HTTP errors
    r = response.json()

    for i in r['images']:
        image = Image.open(io.BytesIO(base64.b64decode(i.split(",", 1)[0])))

        png_payload = {
            "image": "data:image/png;base64," + i
        }
        response2 = requests.post(url=f'{url}/sdapi/v1/png-info', json=png_payload)

        response2.raise_for_status()  # Raise an exception for HTTP errors

        pnginfo = PngImagePlugin.PngInfo()
        pnginfo.add_text("parameters", response2.json().get("info"))
        image.save('output.png', pnginfo=pnginfo)

except requests.exceptions.RequestException as e:
    print("Request error:", e)
except json.JSONDecodeError as e:
    print("JSON decoding error:", e)
except Exception as e:
    print("An error occurred:", e)
