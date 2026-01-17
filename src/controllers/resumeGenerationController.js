export const getResumeGeneration = async (req, res) => {
    try {
        res.status(200).json({ message: "Get resume generation" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createResumeGeneration = async (req, res) => {
    try {
        res.status(201).json({ message: "Create resume generation" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
