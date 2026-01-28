import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import { User } from '@/pages/administracao/usuarios';
import { Button } from '@/components/ui/button';
import { Building } from 'lucide-react';
import UserModules from './btn-modules-user';
interface UserCardProps {
	user: User;
}

export default function UserCard({ user }: UserCardProps) {
	return (
		<Card key={user.id} className='shadow-none'>
			<CardHeader>
				<div>
					<div className='flex justify-between gap-2'>
						<p className='truncate font-semibold text-ellipsis'>{user.ds_name}</p>
						<Badge variant={'outline'} className='cursor-default'>
							{user.is_confirmed ? 'Ativo' : 'Inativo'}
						</Badge>
					</div>
					<p className='text-muted-foreground text-sm'>{user.ds_email}</p>
				</div>
			</CardHeader>
			<CardFooter className='justify-end gap-2'>
				<UserModules user={user} />
				<Button variant='ghost' size='icon'>
					<Building className='h-4 w-4' />
				</Button>
			</CardFooter>
		</Card>
	);
}
