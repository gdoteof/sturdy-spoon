'use client';
import { CoinAccount } from '@/lib/wallet_slice';
import { Table, TableTr, TableTh, TableTbody, TableTd, TableThead, Text, Paper } from '@mantine/core';

interface AddressTableProps {
    coinAccount: CoinAccount;
}

const formatBalance = (balance: number) => {
    return (balance/1e8).toFixed(2);
}

export const AddressTable = (props: AddressTableProps) => (
    <Paper shadow="xs" p="md">
        <Table>
            <TableThead>
                <TableTr>
                    <TableTh>Index</TableTh>
                    <TableTh>Address</TableTh>
                    <TableTh>Balance</TableTh>
                </TableTr>
            </TableThead>
            <TableTbody>
                {props.coinAccount.derivedAddresses.map((info) => (
                    <TableTr key={info.index}>
                        <TableTd>{info.index}</TableTd>
                        <TableTd>
                            <Text style={{ fontFamily: 'monospace' }}>
                                {info.address}
                            </Text>
                        </TableTd>
                        <TableTd>{formatBalance(info.balance)} {props.coinAccount.symbol}</TableTd>
                    </TableTr>
                ))}
            </TableTbody>
        </Table>
    </Paper>
);
