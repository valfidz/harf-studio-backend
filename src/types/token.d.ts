export type Session = {
    token: string |null
}

export type TokenResponse = string | { errorCode: string; message: string };