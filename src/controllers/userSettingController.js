export const getUserSettings = async (req, res) => {
    try {
        res.status(200).json({ message: "Get user settings" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createUserSettings = async (req, res) => {
    try {
        res.status(201).json({ message: "Create user settings" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
