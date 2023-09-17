const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const fs = require("fs");
const path = require("path");
const dfff = require("dialogflow-fulfillment");
const { log } = require("console");
const chokidar = require("chokidar");
const { spawn } = require("child_process");
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

const port = 3000;
const indianFestivals = [
    "Diwali",
    "Holi",
    "Navratri",
    "Eid",
    "Christmas",
    "Ganesh Chaturthi",
    "Durga Puja",
    "Raksha Bandhan",
    "Pongal",
    "Onam",
    "Makar Sankranti",
    "Lohri",
    "Baisakhi",
    "Janmashtami",
    "Eid ul-Adha",
    "Bihu",
    "Karva Chauth",
    "Bonalu",
    "Gudi Padwa",
    "Baisakhi",
    "Maha Shivaratri",
    "Chhath Puja",
    "Guru Nanak Jayanti",
    "Easter",
    "wedding",
    "Traditional"
];
const ages = ["40+", "30 - 40", "20 - 30", "Below 20"];
let seed = 0;
const promptsFilePath = "prompts.json";
const apiScriptPath = "api.js";
let promptsData = {}; // Initialize prompts data
function savePromptsData() {
    try {
        fs.writeFileSync(promptsFilePath, JSON.stringify(promptsData, null, 2));
        console.log("Prompts data saved successfully.");
    } catch (error) {
        console.error("Error saving prompts data:", error);
    }
}

function handlePromptChange() {
    console.log("prompts.json has changed. Saving prompts data...");
    savePromptsData();
}

try {
    promptsData = JSON.parse(fs.readFileSync(promptsFilePath, "utf8"));
} catch (error) {
    console.error("Error reading prompts file:", error);
}

// Watch for changes to prompts.json
chokidar.watch(promptsFilePath).on("change", async (event, path) => {
    try {
        const stats = await fs.promises.stat(promptsFilePath);
        if (stats.size === 0) {
            console.log("File created but no content yet.");
        } else {
            console.log("prompts.json has changed externally. Running api.js...");
            setTimeout(() => {
                // Run api.js using child_process.spawn
                const apiProcess = spawn("node", [apiScriptPath]);
    
                // Listen for output from the spawned process
                apiProcess.stdout.on("data", (data) => {
                    console.log(`api.js output: ${data}`);
                });
    
                apiProcess.stderr.on("data", (data) => {
                    console.error(`api.js error: ${data}`);
                });
            }, 2000);
        }
    } catch (error) {
        console.log("File change detected but not external:", error);
    }
});


let prompts = {
    occasion: "",
    season: "",
    style: "",
    gender: "",
    age: "",
    colors: [],
    region: "",
    accessories: [],
    negative: [],
    seed: 0,
    isLogin: 0
};

const Users = [
    {
        id: "cust1",
        password: "1234"
    },
    {
        id: "cust2",
        password: "5678"
    }
];

const userID = {
    cust1: 1,
    cust2: 2
};

const isLogin = 0;

function isArrayEmpty(arr) {
    return arr.length === 0;
}

function isUserRegistered(id, password) {
    // Find the user with the provided ID in the registeredUsers array
    const user = Users.find(user => user.id === id);
    
    // Check if the user exists and if the provided password matches
    if (user && user.password === password) {
        return true; // User is registered and password is correct
    } else {
        return false; // User is not registered or password is incorrect
    }
}


// Serve static files (CSS, JavaScript, images)
app.use(express.static(path.join(__dirname, "Frontend")));

app.get("/result", (req, res) => {
    const imagePath = path.join(__dirname, "result1.png");
    res.sendFile(imagePath);
});

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/login", (req, res) => {
    res.render("signin");
});

app.post("/login", (req, res) => {
    console.log("hi");
    const id = req.body.id;
    const password = req.body.password;
    if (isUserRegistered(id, password)) {
        prompts["isLogin"] = userID[id];
        res.render("home");
    } else {
        alert("Incorrect id or password");
        res.render("signin");
    }
});

app.post("/", (req, res) => {
    const { queryResult } = req.body;
    const { parameters, queryText } = queryResult;
    const intent = queryResult.intent.displayName;
    if ("season" in parameters) {
        if (prompts["season"].length === 0)
            prompts["season"] = parameters["season"];
    }

    if ("gender" in parameters) {
        if (prompts["gender"].length === 0)
            prompts["gender"] = parameters["gender"];
    }

    if ("style-type" in parameters) {
        if (prompts["style"].length === 0)
            prompts["style"] = parameters["style-type"];
    }

    if ("color" in parameters) {
        for (let i = 0; i < parameters["color"].length; i++) {
            prompts["colors"].push(parameters["color"][i]);
        }
    }

    if ("regions" in parameters) {
        if (prompts["region"].length === 0) {
            prompts["region"] = parameters["regions"];
            if (parameters["regions"] === "Punjab region") 
                prompts["accessories"].push("turban");
        }
    }

    if ("accessories" in parameters) {
        for (let i = 0; i < parameters["accessories"].length; i++) {
            prompts["accessories"].push(parameters["accessories"][i]);
        }
    }

    const agent = new dfff.WebhookClient({
        request: req,
        response: res,
    });

    let intentMap = new Map();
    const reply = handleIntent(intent, parameters, queryText);
    intentMap.set(intent, (agent) => {
        agent.add(reply);
    });
    agent.handleRequest(intentMap);
});

function handleIntent(intent, parameters, queryText) {
    let response = "";
    if (intent === "new.style") {
        prompts["occasion"] = parameters["occasion"];
        if (isArrayEmpty(parameters["occasion"])) {
            prompts["style"] = "casual";
            if (prompts["gender"].length === 0)
                response = `Great! I'd be happy to help. Let's start by selecting a style suitable for your gender. Are you looking for a men's or women's outfit?`;
            else {
                response = `To tailor the outfit suggestions, could you share your preferred age range? You can say Below 20, 20 - 30, 30 - 40 or Above 40.`;
            }
        } else if (indianFestivals.includes(parameters["occasion"])) {
            response = `For [festival] celebrations, a striking ethnic outfit would be wonderful. Are you looking for a men's or women's outfit?`;
            response = response.replace(
                /\[festival\]/g,
                parameters["occasion"]
            );
        } else {
            response = `Great! I'd be happy to help. Let's start by selecting a style suitable for your gender. Are you looking for a men's or women's outfit?`;
        }
    } else if (intent === "style.gender") {
        response = `To tailor the outfit suggestions, could you share your preferred age range? You can say Below 20, 20 - 30, 30 - 40 or Above 40.`;
    } else if (intent === "style.age") {
        if (ages.includes(queryText)) {
            prompts["age"] = queryText;
        }
        if (indianFestivals.includes(prompts["occasion"])) {
            if (prompts["region"].length === 0)
                response = `To better understand your style, could you share any preferences for traditional outfits from a specific region or culture? You can say: Assam, Punjab, and so on.`;
            else
                response = `Finally, would you like to complement your outfit with some accessories? Eg: watch, earrings, etc.`;
        } else {
            if (prompts["season"].length === 0) {
                response = `Could you let me know the season you're preparing your outfit for? Summer, winter, or spring?`;
            } else {
                if (parameters["season"] === "summer") {
                    response =
                        "Now, do you have any specific color preferences? Or should I suggest something colorful and vibrant?";
                } else if (parameters["season"] === "winter") {
                    response =
                        "Do you have specific color preferences? Or should I suggest something that exudes warmth and elegance?";
                } else if (parameters["season"] === "spring") {
                    response =
                        "Do you lean towards any specific colors? Or shall I propose something fresh and lively?";
                }
            }
        }
    } else if (intent === "style.season") {
        if (parameters["season"] === "summer") {
            response =
                "Perfect! Summer it is. Now, do you have any specific color preferences? Or should I suggest something colorful and vibrant?";
        } else if (parameters["season"] === "winter") {
            response =
                "Great choice for winter! Do you have specific color preferences? Or should I suggest something that exudes warmth and elegance?";
        } else if (parameters["season"] === "spring") {
            response =
                "Ah, springtime! Do you lean towards any specific colors? Or shall I propose something fresh and lively for this season?";
        } else {
            response = "Okay. Any color preferences?";
        }
    } else if (intent === "style.color") {
        response = `Having the color pallete defined, which fashion style are you looking to explore?`;
    } else if (intent === "style.type") {
        if (prompts["region"].length === 0)
            response = `To better understand your style, could you share any preferences for traditional outfits from a specific region or culture? You can say: Assam, Punjab, and so on.`;
        else
            response = `Finally, would you like to complement your outfit with some accessories? Eg: watch, earrings, etc.`;
    } else if (intent === "style.region") {
        response = `Finally, would you like to complement your outfit with some accessories? Eg: watch, earrings, etc.`;
    } else if (intent === "style.accessories") {
        response = `I hear you. I'll need a moment to assemble a selection for you. Let me know if you like our recommendation.`;
        if (prompts["region"].length === 0) prompts["region"] = "all region";
        const jsonPrompts = JSON.stringify(prompts, null, 2); // Convert prompts object to JSON with indentation

        fs.writeFile("prompts.json", jsonPrompts, "utf8", (err) => {
            if (err) {
                console.error("Error writing prompts JSON file:", err);
            } else {
                console.log("Prompts JSON file has been saved.");
            }
        });
    } else if (intent === "style.complete - positive") {
        response = `I am glad to hear that. Thankyou for visiting our website.`;
        const filePath = path.join(__dirname, "prompts.json"); 

        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("Error deleting the file:", err);
                return;
            }
            console.log("File deleted successfully.");
        });
    } else if (intent === "style.complete - negative") {
        console.log("hey");
        console.log(parameters);
        if (
            !isArrayEmpty(parameters["accessories"]) &&
            !parameters["accessories"].includes("shoes")
        ) {
            console.log("hellow");
            for (let i = 0; i < parameters["accessories"].length; i++) {
                const accessoryToRemove = parameters["accessories"][i];
                if (accessoryToRemove === "t shirt" || accessoryToRemove === "skirt") {
                    promptsData["accessories"].push(accessoryToRemove);
                } else {
                    const accessoryIndex = promptsData["accessories"].indexOf(accessoryToRemove);
                    // If the accessory is found in the array, remove it
                    if (accessoryIndex !== -1) {
                        promptsData["accessories"].splice(accessoryIndex, 1);
                        console.log(`Accessory "${accessoryToRemove}" removed.`);
                    }
                    promptsData["negative"].push(parameters["accessories"][i]);
                }
            }
            // Load the existing JSON file
        } else {
            seed = promptsData["seed"] + 1;
            seed = seed % 5;
            console.log(seed);
            promptsData["seed"] = seed;
        }
        savePromptsData();

        response = `I'm sorry to hear that the outfit didn't meet your expectations. How about this.`;
    } else if (intent === "style.add") {
        console.log("inside style.add");
        if (!isArrayEmpty(parameters["accessories"])) {
            for (let i=0; i<parameters["accessories"].length; i++) {
                const accessoryToAdd = parameters["accessories"][i];
                promptsData["accessories"].push(accessoryToAdd);
            }
        }
        savePromptsData();
        response = "What about this?"
    }
    return response;
}

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
