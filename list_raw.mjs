async function list() {
    const key = "REPLACED_WITH_ENV_VAL";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}
list();
