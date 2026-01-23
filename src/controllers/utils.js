const camelToSnake = (obj) => {
    if (!obj) return null;
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key.replace(/([A-Z])/g, "_$1").toLowerCase(), value])
    );
};

const snakeToCamel = (obj) => {
    if (!obj) return null;
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key.replace(/(_[a-z])/g, (match) => match[1].toUpperCase()), value])
    );
};

export { camelToSnake, snakeToCamel };
