const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const url = "https://05a718914db97a017e.gradio.live";

let payload = {
    "enable_hr": true,
    "denoising_strength": 0.7,
    // "firstphase_width": 512,
    // "firstphase_height": 768,
    "hr_scale": 1.5,
    "hr_upscaler": "Latent",
    // "hr_prompt": "a person posing for a photoshoot, highly detailed, realistic, detailed lower body, full body, detailed legs, solo, <lora:fashion_2.1-000009:0.7>",
    // "hr_negative_prompt": "cropped, highly detailed eyes, nsfw, badly drawn legs, multiple legs, (badly drawn hands), multiple hands, multiple person, multiple faces, bad outfit",
    "prompt": "a person posing for a photoshoot, highly detailed, realistic, detailed lower body, full body, detailed legs, solo, <lora:fashion_2.1-000009:0.7>, ",
    "seed": 854,
    "sampler_name": "Euler a",
    "steps": 30,
    "cfg_scale": 9,
    "width": 512,
    "height": 768,
    "restore_faces": true,
    // "tiling": false,
    // "do_not_save_samples": false,
    // "do_not_save_grid": false,
    "negative_prompt": "cropped, highly detailed eyes, nsfw, badly drawn legs, multiple legs, (badly drawn hands), multiple hands, multiple person, multiple faces, bad outfit, ",
    // "eta": 0,
    // "s_min_uncond": 0,
    // "s_churn": 0,
    // "s_tmax": 0,
    // "s_tmin": 0,
    // "s_noise": 1,
    // "override_settings": {},
    // "override_settings_restore_afterwards": true,
    // "script_args": [],
    "sampler_index": "Euler a",
    // "script_name": "string",
    // "send_images": true,
    // "save_images": false,
    // "alwayson_scripts": {}
  };
const seed = [854, 967, 88, 1, 6119558];
const promptsFilePath = 'prompts.json';
let promptsData = {};

try {
  promptsData = JSON.parse(fs.readFileSync(promptsFilePath, 'utf8'));
} catch (error) {
  console.error('Error reading prompts file:', error);
}

// Define the order of attributes
const attributeOrder = ['gender', 'age', 'accessories', 'region', 'style', 'occasion', 'colors'];

// Convert attributes to a comma-separated string
const attributesString = attributeOrder.map(attribute => promptsData[attribute]).join(',');
payload["prompt"] = payload["prompt"] + attributesString;
payload["negative_prompt"] = payload["negative_prompt"] + promptsData["negative"];
payload["seed"] = seed[promptsData["seed"]];
if (promptsData["isLogin"] === 1) {
    payload["prompt"] = payload["prompt"] + "<lora:cutomer_1.0:1>";
} else if (promptsData["isLogin"] === 2) {
    payload["prompt"] = payload["prompt"] + "<lora:customer_2.0:1>";
}
console.log(payload);
async function main() {
    try {
        const response = await axios.post(`${url}/sdapi/v1/txt2img`, payload);
        response.data.images.forEach(async (i) => {
            const imageBuffer = Buffer.from(i.split(",", 1)[0], 'base64');
            const image = await loadImage(imageBuffer);

            const pngPayload = {
                image: "data:image/png;base64," + i,
            };

            const response2 = await axios.post(`${url}/sdapi/v1/png-info`, pngPayload);
            const pngInfo = response2.data.info;

            const canvas = createCanvas(image.width, image.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);

            pngInfo.parameters && ctx.fillText(pngInfo.parameters, 10, 10); // Adjust the position

            const outputPath = path.join(__dirname, 'public','images','result.png');
            const out = fs.createWriteStream(outputPath);
            const stream = canvas.createPNGStream();
            stream.pipe(out);

            out.on('finish', () => {
                console.log('Image saved to', outputPath);
            });
        });
    } catch (error) {
        if (error.response) {
            console.log('Request error:', error.response.status, error.response.statusText);
        } else if (error.request) {
            console.log('Request error:', error.message);
        } else {
            console.log('An error occurred:', error.message);
        }
    }
}


main();
