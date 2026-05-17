export async function action(data, callback) {

	try {
		
		const tblActions = {
			getCalcul : () => getCalcul(data, data.client)					
		}
		
		info("Calculatrice:", data.action.command, L.get("plugin.from"), data.client);
			
		if (tblActions[data.action.command]) {
			await tblActions[data.action.command]();
		}

	} catch (err) {
		if (data.client) Avatar.Speech.end(data.client);
		if (err.message) error(err.message);
	}	

	callback();
}


const getCalcul = (data, client) => {

	let sentence = data.rawSentence || data.action.sentence || "";
	sentence = sentence.toLowerCase();

	const uselessWords = [
		"calcule", "calcul", "calculer", "combien font", "combien fait",
		"est-ce que tu peux", "tu peux", "peux tu",
		"s'il te plaît", "stp", "svp"
	];

	uselessWords.forEach(word => {
		sentence = sentence.replace(word, "");
	});

	let expression = sentence
        .replace(/fois|x|multiplie/g, "*")
        .replace(/divisé par|divise par|diviser/g, "/")
        .replace(/plus/g, "+")
        .replace(/moins/g, "-")
        .replace(/ouvre parenth[eè]se/g, "(")
        .replace(/ferme parenth[eè]se/g, ")")
        .replace(/virgule/g, ".")
        .replace(/(\d+)\s*%/g, "($1/100)")
        .replace(/(\d+)\s*%\s*de\s*(\d+)/g, "($1/100)*$2")
        .replace(/racine carr[ée]e? de (\d+)/g, "Math.sqrt($1)")
        .replace(/(\d+)\s*puissance\s*(\d+)/g, "Math.pow($1,$2)")
        .replace(/[^0-9+\-*/().,\sMathpowqrt]/g, "")
        .replace(/,/g, ".")
        .trim();

    if (!expression) {
        return Avatar.speak("Je n'ai pas trouvé de calcul.", client, false, () => {
            Avatar.Speech.end(client);
        });
    }

    let result;
    try {
        result = Function(`"use strict"; return (${expression})`)();
    } catch {
        return Avatar.speak("Erreur dans le calcul.", client, false, () => {
            Avatar.Speech.end(client);
        });
    }

    if (!isFinite(result)) {
        return Avatar.speak("Résultat invalide.", client, false, () => {
            Avatar.Speech.end(client);
        });
    }

    const formatted = result.toLocaleString("fr-FR", {
        maximumFractionDigits: 4
    });

    Avatar.speak(`Le résultat est ${formatted}`, client, false, () => {
        Avatar.Speech.end(client);
    });
};

