import http from '@/axios/index.js';

export function allEmailMessages(email, n = 1, sendEmail) {
    return http.get('/allEmail/list/messages', {params: {email, n, sendEmail}})
}

export function allEmailLatestCode(email, sendEmail) {
    return http.get('/allEmail/latest/code', {params: {email, sendEmail}, noMsg: true})
}
