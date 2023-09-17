const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));



const fetch = require('node-fetch'); // If you are using this in a Node.js environment
const { createCanvas, loadImage } = require('canvas'); // If you are using the canvas library


app.get("/", (req, res) => {
    res.render("home");
}
)

const payload = {
    prompt: 'puppy dog',
    steps: 5,
};

async function main() {
    try {
    const response = await fetch(`${url}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const r = await response.json();

    for (const i of r.images) {
        const base64Data = i.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const image = await loadImage(buffer);

        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        const pngPayload = {
        image: 'data:image/png;base64,' + base64Data,
        };

        const response2 = await fetch(`${url}/sdapi/v1/png-info`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(pngPayload),
        });

        const pngInfo = await response2.json();

      // Assuming you want to save the canvas as an image here
        const fs = require('fs');
        const out = fs.createWriteStream('output.png');
        const stream = canvas.createPNGStream();
        stream.pipe(out);

      // Add text metadata (you might need to adapt this)
        const parameters = pngInfo.info;
        ctx.fillText(parameters, 10, 10);
        ctx.save();
    }
    } catch (error) {
    console.error('Error:', error);
    }
}

main();











// const outfits = [
//     {
//         image: 'outfit1.jpg',
//         description: 'Casual Summer Outfit'
//     },
//     {
//         image: 'outfit2.jpg',
//         description: 'Formal Business Attire'
//     },
// ];

// const outfitImage = document.querySelector('.outfit img');
// const outfitDescription = document.querySelector('.outfit p');
// const generateButton = document.getElementById('generateButton');

// function generateRandomOutfit() {
    
// }

// generateButton.addEventListener('click', generateRandomOutfit);

// Initial outfit generation on page load
// generateRandomOutfit();


app.listen(3000, () => {
  console.log("Server started on port 3000");
});