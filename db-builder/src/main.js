var rumgrJson = require('./rumgr-json');

function useJson(lang) {
    switch (lang) {
        case "rumgr":
            rumgrJson.main();
            break;

        default:
            console.info("Language not implemented yet");

    }
}

switch (process.argv[2]) {
    case "json":
        useJson(process.argv[3]);
        break;

    default:
        console.info("Format not implemented yet");
}

