class Context {
	public readonly ipAddress: string;
	public readonly appName: string;

	constructor(req: Request) {
		this.ipAddress = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
		this.appName = 'graphql-worker';
	}
}

export default Context;
