import api from "./api";

export const getProfile        = ()       => api.get("/settings/profile");
export const updateProfile     = (data)   => api.put("/settings/profile", data);
export const getCompany        = ()       => api.get("/settings/company");
export const updateCompany     = (data)   => api.put("/settings/company", data);
export const changePassword    = (data)   => api.put("/settings/password", data);
export const setup2FA          = ()       => api.post("/settings/2fa/setup");
export const verify2FA         = (token)  => api.post("/settings/2fa/verify", { token });
export const disable2FA        = ()       => api.delete("/settings/2fa");
export const getPreferences    = ()       => api.get("/settings/preferences");
export const updatePreferences = (data)   => api.put("/settings/preferences", data);
export const getSystemSettings    = ()     => api.get("/settings/system");
export const updateSystemSettings = (data) => api.put("/settings/system", data);
export const getBackupStatus      = ()     => api.get("/settings/system/backup");
export const triggerBackup        = ()     => api.post("/settings/system/backup");
