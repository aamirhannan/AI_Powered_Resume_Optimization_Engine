export const getFounderOutreaches = async (req, res) => {
    try {
        res.status(200).json({ message: "Get founder outreaches" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createFounderOutreach = async (req, res) => {
    try {
        res.status(201).json({ message: "Create founder outreach" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
