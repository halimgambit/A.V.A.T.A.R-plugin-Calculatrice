export async function init() {
    await Avatar.lang.addPluginPak('Calculatrice');
}

export async function action(data, callback) {
    try {
        const Locale = await Avatar.lang.getPak('Calculatrice', data.language);
        const tblActions = {
            getCalcul: () => getCalcul(data, data.client, Locale)
        };

        info("Calculatrice:", data.action.command, "from", data.client);

        if (tblActions[data.action?.command]) {
            await tblActions[data.action.command]();
        }
    } catch (err) {
        if (data.client) Avatar.Speech.end(data.client);
        if (err.message) error(err.message);
    } finally {
        callback();
    }
}


const NUMBER_MAP = {
    "zero": "0", "un": "1", "une": "1", "deux": "2", "trois": "3", 
    "quatre": "4", "cinq": "5", "six": "6", "sept": "7", "huit": "8", 
    "neuf": "9", "dix": "10", "onze": "11", "douze": "12", "treize": "13",
    "quatorze": "14", "quinze": "15", "seize": "16", "vingt": "20",
    "trente": "30", "quarante": "40", "cinquante": "50", "soixante": "60",
    "cent": "100", "mille": "1000"
};

const normalizeSentence = raw =>
    raw.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\b(calcul|calcule|calculer|combien font|c est combien|peux tu|tu peux|me|dire|s il te plait)\b/g, "")
        .trim();

const convertWordsToNumbers = sentence => {
    return sentence.split(/\s+/).map(word => NUMBER_MAP[word] || word).join(" ");
};

const replaceOperators = sentence => {
    return sentence
        .replace(/\bmultipl(?:ie|ier|ies|iees)?(?: par)?\b|\bx\b|\bfois\b/g, "*")
        .replace(/\bdivis(?:e|er|es|iees)?(?: par)?\b/g, "/")
        .replace(/\bplus\b/g, "+")
        .replace(/\bmoins\b| - /g, "-");
};

const evaluateSequential = (expr) => {
    const tokens = expr.match(/(\d+(?:\.\d+)?|[\+\-\*\/])/g);
    if (!tokens || tokens.length === 0) throw new Error("Expression invalide");

    let total = parseFloat(tokens[0]);

    for (let i = 1; i < tokens.length; i += 2) {
        const operator = tokens[i];
        const nextValue = parseFloat(tokens[i + 1]);

        if (isNaN(nextValue)) break;

        switch (operator) {
            case '+': total += nextValue; break;
            case '-': total -= nextValue; break;
            case '*': total *= nextValue; break;
            case '/': total /= nextValue; break;
        }
    }

    return total;
};

const getCalcul = (data, client, Locale) => {
    const raw = data.rawSentence || data.action?.sentence || "";
    info("PHRASE RECUE:", raw);

    let sentence = normalizeSentence(raw);
    let expr = convertWordsToNumbers(sentence);
    expr = replaceOperators(expr);

    expr = expr.replace(/[^0-9+\-*/(). ]/g, "").trim();

    if (!expr) {
        const tts = Locale.get("speech.noUnderstand");
        info(tts);
        return Avatar.speak(tts, client, () =>
            Avatar.Speech.end(client)
        );
    }

    let result;

    try {
        result = evaluateSequential(expr);
    } catch (err) {
        const tts = Locale.get("speech.noCalcul");
        info(tts);
        return Avatar.speak(tts, client, () =>
            Avatar.Speech.end(client)
        );
    }

    const spokenExpr = expr
        .replace(/\*/g, " fois ")
        .replace(/\//g, " divisé par ")
        .replace(/\+/g, " plus ")
        .replace(/\-/g, " moins ");
        
    const tts = Locale.get(["speech.speakCalcul", spokenExpr, result]);

    info(tts);

    Avatar.speak(tts, client, () =>
        Avatar.Speech.end(client)
    );
};
