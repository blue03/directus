import {
	StorageManager,
	LocalFileSystemStorage,
	StorageManagerConfig,
	Storage,
} from '@slynova/flydrive';
import camelcase from 'camelcase';

import { AmazonWebServicesS3Storage } from '@slynova/flydrive-s3';
import { GoogleCloudStorage } from '@slynova/flydrive-gcs';

/** @todo dynamically load storage adapters here */

console.log(getStorageConfig());
const storage = new StorageManager(getStorageConfig());

registerDrivers(storage);

export default storage;

function getStorageConfig(): StorageManagerConfig {
	const config: any = { disks: {} };

	for (const [key, value] of Object.entries(process.env)) {
		if (key.startsWith('STORAGE') === false) continue;
		if (key === 'STORAGE_LOCATIONS') continue;
		if (key.endsWith('PUBLIC_URL')) continue;

		const disk = key.split('_')[1].toLowerCase();
		if (!config.disks[disk]) config.disks[disk] = { config: {} };

		if (key.endsWith('DRIVER')) {
			config.disks[disk].driver = value;
			continue;
		}

		const configKey = camelcase(
			key.split('_').filter((_, index) => [0, 1].includes(index) === false)
		);
		config.disks[disk].config[configKey] = value;
	}

	return config;
}

function registerDrivers(storage: StorageManager) {
	const usedDrivers: string[] = [];

	for (const [key, value] of Object.entries(process.env)) {
		if ((key.startsWith('STORAGE') && key.endsWith('DRIVER')) === false) continue;
		if (usedDrivers.includes(value) === false) usedDrivers.push(value);
	}

	usedDrivers.forEach((driver) => {
		storage.registerDriver<Storage>(driver, getStorageDriver(driver));
	});
}

function getStorageDriver(driver: string) {
	switch (driver) {
		case 'local':
			return LocalFileSystemStorage;
		case 's3':
			return AmazonWebServicesS3Storage;
		case 'gcs':
			return GoogleCloudStorage;
	}
}
