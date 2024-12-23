import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ["dist/**", "*.config.mjs"]
	},
	eslint.configs.recommended,
	...tseslint.configs.strictTypeChecked,
	{
		files: ['**/*.{test.ts,ts,tsx,mts,cts}'],
		rules: {
			"no-undef": "off",
			"@typescript-eslint/no-extraneous-class": ["error", { allowStaticOnly: true }],
			"@typescript-eslint/no-invalid-void-type": ["error", { allowAsThisParameter: true}]
		},
	},
	{
		languageOptions: 
		{
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		}
	}
);