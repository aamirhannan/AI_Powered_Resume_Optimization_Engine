export const getGeneratedResume = async (req, res) => {
    try {
        res.status(200).json({ message: "Get generated resume" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createGeneratedResume = async (req, res) => {
    try {
        res.status(201).json({ message: "Create generated resume" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
