import { Paper, Text, Group, RingProgress } from '@mantine/core';

interface BalanceCardProps {
    balance: number;
    address: string;
}

export const BalanceCard = ({ balance, address }: BalanceCardProps) => (
    <Paper shadow="xs" p="md">
        <Group justify="space-between">
            <div>
                <Text size="xs" c="dimmed">Total Balance</Text>
                <Text size="xl" fw={700}>{(balance/1e8).toFixed(4)} RUNE</Text>
                <Text size="xs" c="dimmed" mt="sm">
                    {address}
                </Text>
            </div>
            <RingProgress
                size={80}
                roundCaps
                thickness={8}
                sections={[{ value: balance > 0 ? 100 : 0, color: 'blue' }]}
            />
        </Group>
    </Paper>
);