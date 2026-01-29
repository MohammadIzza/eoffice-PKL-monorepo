'use client';

import { useEffect, useState } from 'react';
import { MasterCRUDTable, type Column } from '@/components/features/master/MasterCRUDTable';
import { mahasiswaService, type Mahasiswa } from '@/services';
import { departemenService, programStudiService } from '@/services';
import { handleApiError } from '@/lib/api';

export default function MasterMahasiswaPage() {
	const [data, setData] = useState<Mahasiswa[]>([]);
	const [departemenList, setDepartemenList] = useState<Array<{ value: string; label: string }>>([]);
	const [programStudiList, setProgramStudiList] = useState<Array<{ value: string; label: string }>>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const [mahasiswaResult, deptResult, prodiResult] = await Promise.all([
				mahasiswaService.getAll(),
				departemenService.getAll(),
				programStudiService.getAll(),
			]);
			setData(mahasiswaResult);
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

	const columns: Column<Mahasiswa>[] = [
		{
			key: 'user',
			header: 'Nama',
			render: (item) => item.user?.name || '-',
		},
		{ key: 'nim', header: 'NIM' },
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
		await mahasiswaService.create({
			name: formData.name,
			email: formData.email,
			noHp: formData.noHp,
			nim: formData.nim,
			tahunMasuk: formData.tahunMasuk,
			alamat: formData.alamat,
			tempatLahir: formData.tempatLahir,
			tanggalLahir: formData.tanggalLahir,
			departemenId: formData.departemenId,
			programStudiId: formData.programStudiId,
		});
		await fetchData();
	};

	const handleUpdate = async (id: string, formData: Record<string, any>) => {
		await mahasiswaService.update(id, {
			noHp: formData.noHp,
			nim: formData.nim,
			tahunMasuk: formData.tahunMasuk,
			alamat: formData.alamat,
			tempatLahir: formData.tempatLahir,
			tanggalLahir: formData.tanggalLahir,
			departemenId: formData.departemenId,
			programStudiId: formData.programStudiId,
		});
		await fetchData();
	};

	return (
		<MasterCRUDTable
			title="Mahasiswa"
			description="Kelola data mahasiswa."
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
				{ key: 'nim', label: 'NIM', required: true },
				{ key: 'tahunMasuk', label: 'Tahun Masuk', required: true },
				{ key: 'noHp', label: 'No. HP', required: true },
				{ key: 'alamat', label: 'Alamat' },
				{ key: 'tempatLahir', label: 'Tempat Lahir' },
				{ key: 'tanggalLahir', label: 'Tanggal Lahir', type: 'text' },
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
				{ key: 'nim', label: 'NIM', required: true },
				{ key: 'tahunMasuk', label: 'Tahun Masuk', required: true },
				{ key: 'noHp', label: 'No. HP', required: true },
				{ key: 'alamat', label: 'Alamat' },
				{ key: 'tempatLahir', label: 'Tempat Lahir' },
				{ key: 'tanggalLahir', label: 'Tanggal Lahir', type: 'text' },
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
