import { LedgerRow, LedgerSummary } from './domain/ledger-export.rules';
export declare function ledgerCsv(rows: LedgerRow[]): Buffer;
export declare function ledgerXlsx(rows: LedgerRow[], summary: LedgerSummary, title: string): Promise<Buffer>;
