export const getEmailAutomation = async (req, res) => {
    try {
        res.status(200).json({ message: "Get email automation" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createEmailAutomation = async (req, res) => {
    try {
        res.status(201).json({ message: "Create email automation" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
