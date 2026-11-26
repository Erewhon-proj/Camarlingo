import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { getAppInfo, type AppInfo } from './backend';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

const invokeMock = vi.mocked(invoke);

describe('getAppInfo', () => {
	beforeEach(() => {
		invokeMock.mockReset();
	});

	it('calls the app_info command', async () => {
		// arrange
		invokeMock.mockResolvedValue({ name: 'Camarlingo', version: '0.1.0' });

		// act
		await getAppInfo();

		// assert
		expect(invokeMock).toHaveBeenCalledWith('app_info');
	});

	it('returns what the command returns', async () => {
		// arrange
		const expected: AppInfo = { name: 'Camarlingo', version: '0.1.0' };
		invokeMock.mockResolvedValue(expected);

		// act
		const info = await getAppInfo();

		// assert
		expect(info).toEqual(expected);
	});
});
