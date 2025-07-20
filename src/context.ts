class Context {
	public readonly ipAddress: string;

	constructor(req: Request) {
		this.ipAddress = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
	}
}

export default Context;
