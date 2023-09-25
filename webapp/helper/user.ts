

export type User = {
    id: number;
    username: string;
    email: string;
    roleid: number;
};

export type ParsedRole = {
    id: number;
    name: string;
    capabilities: UserRights;
};

export type UserRights = {
    canEditUsers: boolean,
    canUnfreeze: boolean,
    canUploadFiles: boolean
}