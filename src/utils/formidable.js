import { parse } from 'node:querystring';
import * as XLSX from 'xlsx';
import crypto from 'crypto';

export const parseForm = async (request) => {
  // 判斷是否為 multipart/form-data
  const contentType = request.headers.get('content-type') || '';
  
  if (!contentType.includes('multipart/form-data')) {
    throw new Error('Content type must be multipart/form-data');
  }

  const boundary = getBoundary(contentType);
  if (!boundary) {
    throw new Error('No boundary found in multipart/form-data');
  }

  const buffer = await request.arrayBuffer();
  const parts = parseMultipartFormData(buffer, boundary);

  const fields = {};
  const files = {};

  for (const part of parts) {
    if (part.filename) {
      // 處理文件部分 - 直接保存數據到記憶體
      files[part.name] = [{
        originalFilename: part.filename,
        mimetype: part.contentType,
        size: part.data.byteLength,
        data: part.data // 直接保存 Buffer 數據
      }];
    } else {
      // 處理普通字段
      fields[part.name] = part.data.toString('utf8');
    }
  }

  return { fields, files };
};

// 解析 content-type 來獲取 boundary
function getBoundary(contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  return boundaryMatch ? (boundaryMatch[1] || boundaryMatch[2]) : null;
}

// 解析 multipart/form-data
function parseMultipartFormData(buffer, boundary) {
  const boundaryBuffer = Buffer.from(`--${boundary}`, 'utf8');
  const endBoundaryBuffer = Buffer.from(`--${boundary}--`, 'utf8');
  const data = Buffer.from(buffer);
  
  let position = 0;
  const parts = [];
  
  while (position < data.length) {
    const boundaryPosition = findBuffer(data, boundaryBuffer, position);
    
    if (boundaryPosition === -1) {
      break;
    }
    
    // 移動到邊界後
    position = boundaryPosition + boundaryBuffer.length;
    
    // 檢查是否為結束邊界
    if (data.slice(position, position + 2).toString() === '--') {
      break;
    }
    
    // 跳過 CR LF
    position += 2;
    
    // 解析 headers
    let headerEnd = findString(data, '\r\n\r\n', position);
    if (headerEnd === -1) {
      break;
    }
    
    const headersString = data.slice(position, headerEnd).toString('utf8');
    const headers = parseHeaders(headersString);
    position = headerEnd + 4; // 跳過 \r\n\r\n
    
    // 找下一個邊界
    const nextBoundaryPosition = findBuffer(data, boundaryBuffer, position);
    const endPosition = nextBoundaryPosition !== -1 ? nextBoundaryPosition - 2 : data.length; // 減去 \r\n
    
    // 提取此部分的數據
    const partData = data.slice(position, endPosition);
    
    // 解析 Content-Disposition 來獲取 name 和 filename
    const contentDisposition = headers['content-disposition'] || '';
    const nameMatch = contentDisposition.match(/name="([^"]+)"/);
    const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
    
    parts.push({
      name: nameMatch ? nameMatch[1] : '',
      filename: filenameMatch ? filenameMatch[1] : null,
      contentType: headers['content-type'] || 'text/plain',
      data: partData
    });
    
    position = endPosition;
  }
  
  return parts;
}

// 在 buffer 中查找另一個 buffer
function findBuffer(buffer, search, start = 0) {
  for (let i = start; i <= buffer.length - search.length; i++) {
    let found = true;
    for (let j = 0; j < search.length; j++) {
      if (buffer[i + j] !== search[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
}

// 在 buffer 中查找字符串
function findString(buffer, search, start = 0) {
  return findBuffer(buffer, Buffer.from(search), start);
}

// 解析 HTTP 頭部
function parseHeaders(headersString) {
  const headers = {};
  const lines = headersString.split('\r\n');
  
  for (const line of lines) {
    const colonPos = line.indexOf(':');
    if (colonPos !== -1) {
      const name = line.slice(0, colonPos).trim().toLowerCase();
      const value = line.slice(colonPos + 1).trim();
      headers[name] = value;
    }
  }
  
  return headers;
}