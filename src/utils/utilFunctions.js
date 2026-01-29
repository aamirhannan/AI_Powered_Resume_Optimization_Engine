export const getCompanyFromEmail = (email) => {
    const company = email.split('@')[1];
    return company;
}