figma.showUI(__html__);

figma.ui.resize(400, 400);

const loadedFonts: string[] = [];

async function translateText(serverURL: string, text: string, target_lang_code: string): Promise<string> {
  try {
    const bodyString = JSON.stringify({
      "text": text,
      "target_language_code": target_lang_code
    });

    const response = await fetch(serverURL, {
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
  } catch (error) {
    console.error('Error translating text:', error);
  }
  return "";
}

function findAllTextNodesOnSceneNodes(sceneNode: readonly SceneNode[]): TextNode[] {
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

  for (const node of sceneNode) {
    traverse(node);
  }
  return textNodes;
}

figma.ui.onmessage = async (msg: {serverURL: string, type: string, targetLangCode: string}) => {
  if (msg.type === 'translate') {
    const textNodes = findAllTextNodesOnSceneNodes(figma.currentPage.selection);
    const totalNodes = textNodes.length;
    let processedNodes = 0;

    textNodes.forEach(async (node) => {
      const font = (node.fontName as FontName);
      const fontKey = `${font.family}_${font.style}`
      
      if (loadedFonts.indexOf(fontKey) == -1) {
        await figma.loadFontAsync({ family: font.family, style: font.style });
        loadedFonts.push(fontKey);
      }

      const translatedText = await translateText(msg.serverURL, node.characters, msg.targetLangCode);
      if (translatedText.length > 0) {
        node.characters = translatedText;
      }
      processedNodes += 1;
      figma.ui.postMessage({ type: 'progress', totalNodes, processedNodes });
    });
  }
};
