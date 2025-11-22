/**
 * 共享的测试数据和工具函数
 */

export interface User {
  id: string;
  name: string;
}

export interface Book {
  id: string;
  title: string;
}

export async function getUser(userId: string): Promise<User> {
  console.log('getUser invoked');
  return { id: userId, name: 'John Doe' };
}

export async function queryUser(): Promise<User[]> {
  console.log('queryUser invoked');
  return [
    { id: '1', name: 'John Doe1' },
    { id: '2', name: 'John Doe2' },
  ];
}

export async function allUser(): Promise<User[]> {
  console.log('allUser invoked');
  return [
    { id: '1', name: 'John Doe1' },
    { id: '2', name: 'John Doe2' },
    { id: '3', name: 'John Doe3' },
  ];
}

export async function foo(num: number): Promise<string> {
  console.log('foo invoked');
  return `Result: ${num}`;
}

export async function deleteUser(user: User): Promise<void> {
  console.log('deleteUser invoked');
  return;
}

export async function getBook(bookId: string): Promise<Book> {
  console.log('getBook invoked');
  return { id: bookId, title: 'book_01' };
}

export async function deleteBook(book: Book): Promise<void> {
  console.log('deleteBook invoked');
  return;
}

export function throwError(): Promise<number> {
  console.log('throwError invoked');
  const a = 1;
  if (a === 1) {
    throw new Error('Test error');
  }
  return a;
}

export function syncAdd(a: number, b: number): number {
  console.log('syncAdd invoked');
  return a + b;
}

export function syncMultiply(a: number, b: number): number {
  console.log('syncMultiply invoked');
  return a * b;
}
