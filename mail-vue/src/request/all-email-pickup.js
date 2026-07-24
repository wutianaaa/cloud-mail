import http from '@/axios/index.js';

export function allEmailMessages(email, n = 1, sendEmail) {
    return http.get('/allEmail/list/messages', {params: {email, n, sendEmail}})
}

export function allEmailLatestCode(email, sendEmail) {
    return http.get('/allEmail/latest/code', {params: {email, sendEmail}, noMsg: true})
}

export function allEmailPickupApiKey() {
    return http.get('/allEmail/pickup/apiKey')
}

export function allEmailPickupSetApiKey(apiKeys) {
    return http.put('/allEmail/pickup/apiKey', {apiKeys})
}

export function allEmailPickupPublicToken() {
    return http.get('/allEmail/pickup/publicToken')
}

export function genPublicToken(email, password) {
    return http.post('/public/genToken', {email, password})
}