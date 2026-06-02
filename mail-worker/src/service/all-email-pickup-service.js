import orm from '../entity/orm';
import email from '../entity/email';
import { and, desc, eq, ne, sql } from 'drizzle-orm';
import { emailConst, isDel } from '../const/entity-const';
import verifyUtils from '../utils/verify-utils';
import BizError from '../error/biz-error';
import { t } from '../i18n/i18n';
import KvConst from '../const/kv-const';

const allEmailPickupService = {
	async messages(c, params) {
		let { email: toEmail, toEmail: receiveEmail, sendEmail, fromEmail, sender, n } = params;

		toEmail = toEmail || receiveEmail;
		sendEmail = sendEmail || fromEmail || sender;
		this.verifyEmail(toEmail);
		this.verifyOptionalEmail(sendEmail);
		n = this.size(n);

		return orm(c).select({
			emailId: email.emailId,
			sendEmail: email.sendEmail,
			sendName: email.name,
			subject: email.subject,
			toEmail: email.toEmail,
			toName: email.toName,
			type: email.type,
			status: email.status,
			code: email.code,
			createTime: email.createTime,
			content: email.content,
			text: email.text,
			isDel: email.isDel,
		}).from(email)
			.where(this.baseWhere(toEmail, sendEmail))
			.orderBy(desc(email.emailId))
			.limit(n);
	},

	async latestCode(c, params) {
		const { email: paramsEmail, toEmail, sendEmail, fromEmail, sender } = params;
		const receiveEmail = paramsEmail || toEmail;
		const senderEmail = sendEmail || fromEmail || sender;

		this.verifyEmail(receiveEmail);
		this.verifyOptionalEmail(senderEmail);

		const row = await orm(c).select({
			emailId: email.emailId,
			sendEmail: email.sendEmail,
			subject: email.subject,
			toEmail: email.toEmail,
			code: email.code,
			createTime: email.createTime,
		}).from(email)
			.where(this.baseWhere(receiveEmail, senderEmail))
			.orderBy(desc(email.emailId))
			.limit(1)
			.get();

		return row || { code: '' };
	},

	async getApiKey(c) {
		const apiKey = await c.env.kv.get(KvConst.ALL_EMAIL_PICKUP_API_KEY);

		return {
			apiKey,
			hasApiKey: !!apiKey
		};
	},

	async setApiKey(c, params) {
		const { apiKey } = params;

		if (!apiKey) {
			await c.env.kv.delete(KvConst.ALL_EMAIL_PICKUP_API_KEY);
			return {
				apiKey: '',
				hasApiKey: false
			};
		}

		await c.env.kv.put(KvConst.ALL_EMAIL_PICKUP_API_KEY, apiKey);

		return {
			apiKey,
			hasApiKey: true
		};
	},

	baseWhere(toEmail, sendEmail) {
		const conditions = [
			sql`${email.toEmail} COLLATE NOCASE = ${toEmail}`,
			eq(email.type, emailConst.type.RECEIVE),
			eq(email.isDel, isDel.NORMAL),
			ne(email.status, emailConst.status.SAVING)
		];

		if (sendEmail) {
			conditions.push(sql`${email.sendEmail} COLLATE NOCASE = ${sendEmail}`);
		}

		return and(...conditions);
	},

	size(n) {
		n = Number(n || 1);

		if (Number.isNaN(n) || n < 1) {
			n = 1;
		}

		if (n > 50) {
			n = 50;
		}

		return n;
	},

	verifyEmail(email) {
		if (!email) {
			throw new BizError(t('emptyEmail'));
		}

		if (!verifyUtils.isEmail(email)) {
			throw new BizError(t('notEmail'));
		}
	},

	verifyOptionalEmail(email) {
		if (email && !verifyUtils.isEmail(email)) {
			throw new BizError(t('notEmail'));
		}
	}
};

export default allEmailPickupService;
