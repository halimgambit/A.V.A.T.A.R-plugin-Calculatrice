export async function action(data, callback) {

	try {
		
		const tblActions = {
			getCalcul : () => getCalcul(data, data.client, callback)					
		}
		
		info("Calculatrice:", data.action.command, L.get("plugin.from"), data.client);
			
		if (tblActions[data.action.command]) {
			tblActions[data.action.command]();
		} else {
			callback();
		}

	} catch (err) {
		if (data.client) Avatar.Speech.end(data.client);
		if (err.message) error(err.message);
		callback();
	}	
}


const getCalcul = (data, client, callback) => {

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

		// opérations
		.replace(/fois|x|multiplie/g, "*")
		.replace(/divisé par|divise par|diviser/g, "/")
		.replace(/plus/g, "+")
		.replace(/moins/g, "-")

		// parenthèses vocales
		.replace(/ouvre parenth[eè]se/g, "(")
		.replace(/ferme parenth[eè]se/g, ")")

		// virgule parlée
		.replace(/virgule/g, ".")

		// pourcentage simple
		.replace(/(\d+)\s*%/g, "($1/100)")

		// pourcentage de
		.replace(/(\d+)\s*%\s*de\s*(\d+)/g, "($1/100)*$2")

		// racine carrée
		.replace(/racine carr[ée]e? de (\d+)/g, "Math.sqrt($1)")

		// puissance
		.replace(/(\d+)\s*puissance\s*(\d+)/g, "Math.pow($1,$2)")

		// nettoyage sécurité
		.replace(/[^0-9+\-*/().,\sMathpowqrt]/g, "")
		.replace(/,/g, ".")
		.trim();

	if (!expression) {
		Avatar.speak("Je n'ai pas trouvé de calcul.", client, () => {
			Avatar.Speech.end(client);
			callback();
		});
		return;
	}

	let result;

	try {
		result = Function(`"use strict"; return (${expression})`)();
	} catch {
		Avatar.speak("Erreur dans le calcul.", client, () => {
			Avatar.Speech.end(client);
			callback();
		});
		return;
	}

	if (!isFinite(result)) {
		Avatar.speak("Résultat invalide.", client, () => {
			Avatar.Speech.end(client);
			callback();
		});
		return;
	}

	const formatted = result.toLocaleString("fr-FR", {
		maximumFractionDigits: 4
	});

	Avatar.speak(`Le résultat est ${formatted}`, client, () => {
		Avatar.Speech.end(client);
		callback();
	});
};

