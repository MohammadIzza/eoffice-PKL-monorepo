'use client';

import { useEffect, useState } from 'react';
import { MasterCRUDTable, type Column } from '@/components/features/master/MasterCRUDTable';
import { userService, type User } from '@/services';
import { handleApiError } from '@/lib/api';

export default function MasterUserPage() {
	const [data, setData] = useState<User[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await userService.getAll();
			setData(result);
		} catch (err) {
			setError(handleApiError(err).message);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const columns: Column<User>[] = [
		{ key: 'name', header: 'Nama' },
		{ key: 'email', header: 'Email' },
		{
			key: 'emailVerified',
			header: 'Status',
			render: (item) => (item.emailVerified ? 'Terverifikasi' : 'Belum Terverifikasi'),
		},
	];

	const handleCreate = async (formData: Record<string, any>) => {
		await userService.create({
			name: formData.name,
			email: formData.email,
		});
		await fetchData();
	};

	const handleUpdate = async (id: string, formData: Record<string, any>) => {
		await userService.update(id, {
			name: formData.name,
		});
		await fetchData();
	};

	return (
		<MasterCRUDTable
			title="User"
			description="Kelola akun pengguna."
			columns={columns}
			data={data}
			isLoading={isLoading}
			error={error}
			onCreate={handleCreate}
			onUpdate={handleUpdate}
			getId={(item) => item.id}
			formFields={[
				{ key: 'name', label: 'Nama', required: true },
				{ key: 'email', label: 'Email', type: 'email', required: true },
			]}
		/>
	);
}
