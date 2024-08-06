declare type ConfigKey = "TOKEN" | "GEMINI_TOKEN";

declare type EnvKeys = {
	[key in ConfigKey]: string;
};

declare namespace NodeJS {
	interface ProcessEnv extends EnvKeys {}
}
