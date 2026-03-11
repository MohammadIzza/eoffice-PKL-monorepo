'use client';

import { useEffect, useState } from 'react';
import { MasterCRUDTable, type Column } from '@/components/features/master/MasterCRUDTable';
import { userService, type User } from '@/services';
import { roleService } from '@/services';
import { handleApiError } from '@/lib/api';

export default function MasterUserPage() {
	const [data, setData] = useState<User[]>([]);
	const [roleList, setRoleList] = useState<Array<{ value: string; label: string }>>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const [userResult, roles] = await Promise.all([
				userService.getAll(),
				roleService.getAll(),
			]);
			// Flatten roleId for form pre-population
			const usersWithRole = userResult.map(u => ({
				...u,
				roleId: u.userRole?.[0]?.roleId || '',
			}));
			setData(usersWithRole);
			setRoleList(roles.map((r) => ({ value: r.id, label: r.name })));
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
			key: 'userRole',
			header: 'Role',
			render: (item) => {
				const roles = item.userRole?.map((ur) => ur.role?.name).filter(Boolean);
				return roles && roles.length > 0 ? roles.join(', ') : '-';
			},
		},
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
			roleId: formData.roleId || undefined,
		});
		await fetchData();
	};

	const handleUpdate = async (id: string, formData: Record<string, any>) => {
		await userService.update(id, {
			name: formData.name,
			roleId: formData.roleId !== undefined ? (formData.roleId || '') : undefined,
		});
		await fetchData();
	};

	const handleDelete = async (id: string) => {
		await userService.delete(id);
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
			onDelete={handleDelete}
			getId={(item) => item.id}
			deleteWarning="Menghapus User akan otomatis menghapus data Mahasiswa atau Pegawai yang menggunakan email ini. Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat diurungkan."
			formFields={[
				{ key: 'name', label: 'Nama', required: true },
				{ key: 'email', label: 'Email', type: 'email', required: true },
				{
					key: 'roleId',
					label: 'Role',
					type: 'select',
					options: roleList,
				},
			]}
			editFormFields={[
				{ key: 'name', label: 'Nama', required: true },
				{
					key: 'roleId',
					label: 'Role',
					type: 'select',
					options: roleList,
				},
			]}
		/>
	);
}

