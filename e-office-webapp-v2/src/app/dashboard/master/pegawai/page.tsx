'use client';

import { useEffect, useState } from 'react';
import { MasterCRUDTable, type Column } from '@/components/features/master/MasterCRUDTable';
import { pegawaiService, type Pegawai } from '@/services';
import { departemenService, programStudiService } from '@/services';
import { handleApiError } from '@/lib/api';

export default function MasterPegawaiPage() {
	const [data, setData] = useState<Pegawai[]>([]);
	const [departemenList, setDepartemenList] = useState<Array<{ value: string; label: string }>>([]);
	const [programStudiList, setProgramStudiList] = useState<Array<{ value: string; label: string }>>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const [pegawaiResult, deptResult, prodiResult] = await Promise.all([
				pegawaiService.getAll(),
				departemenService.getAll(),
				programStudiService.getAll(),
			]);
			setData(pegawaiResult);
			setDepartemenList(deptResult.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })));
			setProgramStudiList(prodiResult.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })));
		} catch (err) {
			setError(handleApiError(err).message);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const columns: Column<Pegawai>[] = [
		{
			key: 'user',
			header: 'Nama',
			render: (item) => item.user?.name || '-',
		},
		{ key: 'nip', header: 'NIP' },
		{ key: 'jabatan', header: 'Jabatan' },
		{
			key: 'programStudi',
			header: 'Program Studi',
			render: (item) => item.programStudi?.name || '-',
		},
		{
			key: 'departemen',
			header: 'Departemen',
			render: (item) => item.departemen?.name || '-',
		},
	];

	const handleCreate = async (formData: Record<string, any>) => {
		await pegawaiService.create({
			name: formData.name,
			email: formData.email,
			nip: formData.nip,
			jabatan: formData.jabatan,
			noHp: formData.noHp,
			departemenId: formData.departemenId,
			programStudiId: formData.programStudiId,
		});
		await fetchData();
	};

	const handleUpdate = async (id: string, formData: Record<string, any>) => {
		await pegawaiService.update(id, {
			nip: formData.nip,
			jabatan: formData.jabatan,
			noHp: formData.noHp,
			departemenId: formData.departemenId,
			programStudiId: formData.programStudiId,
		});
		await fetchData();
	};

	return (
		<MasterCRUDTable
			title="Pegawai"
			description="Kelola data pegawai dan dosen."
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
				{ key: 'nip', label: 'NIP', required: true },
				{ key: 'jabatan', label: 'Jabatan', required: true },
				{ key: 'noHp', label: 'No. HP' },
				{
					key: 'departemenId',
					label: 'Departemen',
					type: 'select',
					options: departemenList,
					required: true,
				},
				{
					key: 'programStudiId',
					label: 'Program Studi',
					type: 'select',
					options: programStudiList,
					required: true,
				},
			]}
			editFormFields={[
				{ key: 'nip', label: 'NIP', required: true },
				{ key: 'jabatan', label: 'Jabatan', required: true },
				{ key: 'noHp', label: 'No. HP' },
				{
					key: 'departemenId',
					label: 'Departemen',
					type: 'select',
					options: departemenList,
					required: true,
				},
				{
					key: 'programStudiId',
					label: 'Program Studi',
					type: 'select',
					options: programStudiList,
					required: true,
				},
			]}
		/>
	);
}
