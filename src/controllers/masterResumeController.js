export const getMasterResume = async (req, res) => {
    try {
        res.status(200).json({ message: "Get master resume" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createMasterResume = async (req, res) => {
    try {
        res.status(201).json({ message: "Create master resume" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
