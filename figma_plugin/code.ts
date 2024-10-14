// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);


async function translateText(text: string): Promise<string> {
  try {
    
    const bodyString = JSON.stringify({
      "text": text,
      "target_language_code": "es"
    });

    console.log(bodyString);

    const response = await fetch('http://localhost:8080/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: bodyString,
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data["translated_text"];
    // return data.translations[0].text;
  } catch (error) {
    console.error('Error translating text:', error);
  }
  return "";
}

function findAllTextNodes(currentPage: PageNode): TextNode[] {
  const textNodes: TextNode[] = [];

  function traverse(node: SceneNode) {
    if (node.type === 'TEXT') {
      textNodes.push(node);
    }
    if ('children' in node) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  for (const node of currentPage.children) {
    traverse(node);
  }
  return textNodes;
}


// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = async (msg: {type: string, count: number}) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'create-shapes') {
    // This plugin creates rectangles on the screen.
    const numberOfRectangles = msg.count;

    const nodes: SceneNode[] = [];
    for (let i = 0; i < numberOfRectangles; i++) {
      const rect = figma.createRectangle();
      rect.x = i * 150;
      rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
      figma.currentPage.appendChild(rect);
      nodes.push(rect);
    }
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  if (msg.type === 'translate') {
    await figma.loadFontAsync({ family: "Inter", style: "Regular" })
    await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
    await figma.loadFontAsync({ family: "Roboto", style: "Bold" });
    await figma.loadFontAsync({ family: "Roboto", style: "Italic" });
    await figma.loadFontAsync({ family: "Roboto", style: "Bold Italic" }) 
    await figma.loadFontAsync({ family: "Roboto", style: "Black" }) 
    await figma.loadFontAsync({ family: "Roboto", style: "Light" })

    const textNodes = findAllTextNodes(figma.currentPage);
    // console.log(textNodes);
    textNodes.forEach(async (node) => {
      const translatedText = await translateText(node.characters);
      // console.log(translatedText)
      if (translatedText.length > 0) {
        node.characters = translatedText;
      }
      // .then((translatedText) => {
      //   // console.log(node.characters);
      //   // console.log(translatedText);
      //   node.characters = translatedText;
      // });
    });
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  // figma.closePlugin();
};
