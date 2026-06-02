import app from '../hono/hono';
import result from '../model/result';
import allEmailPickupService from '../service/all-email-pickup-service';

app.get('/allEmail/list/messages', async (c) => {
	const list = await allEmailPickupService.messages(c, c.req.query());
	return c.json(result.ok(list));
});

app.get('/allEmail/latest/code', async (c) => {
	const data = await allEmailPickupService.latestCode(c, c.req.query());
	return c.json(result.ok(data));
});
