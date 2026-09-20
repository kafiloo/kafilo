import React from 'react';

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  subTotal: number;
}

export interface ReceiptData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  date: string;
  time: string;
  txId: string;
  cashierName: string;
  items: ReceiptItem[];
  subtotal: number;
  tax?: number;           
  taxRate?: number;       
  serviceCharge?: number; 
  serviceRate?: number;   
  total: number;
  paymentMethod: string;
  wifiName?: string | null;
  wifiPassword?: string | null;
  footerMessage?: string | null;
}

const parseItemName = (fullName: string) => {
  const match = fullName.match(/^(.*?)(?:\s*\((.*?)\))?$/);
  const baseName = match ? match[1] : fullName;
  const variantString = match && match[2] ? match[2] : "";
  const variants = variantString ? variantString.split(', ') : [];
  return { baseName, variants };
};

export default function ReceiptTicket({ data }: { data: ReceiptData }) {
  return (
    <div className="receipt-ticket w-full max-w-[400px] mx-auto bg-white rounded-sm relative shadow-md" style={{ filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.05))" }}>
      <div className="absolute top-0 left-0 right-0 h-2 bg-repeat-x" style={{ backgroundImage: 'radial-gradient(circle at 50% 0, transparent 0, transparent 4px, white 4px)', backgroundSize: '12px 12px' }}></div>
      
      <div className="p-6 pt-10 pb-10 font-mono text-[12px] text-gray-800">
        
        <div className="text-center mb-6">
          <h3 className="font-black text-xl mb-1 font-sans tracking-tight text-[#1a1f36] uppercase">{data.storeName}</h3>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">{data.storeAddress || "Jl. Senopati No. 42, Jakarta"}</p>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">{data.storePhone || "Tel: (021) 555-0123"}</p>
        </div>

        <div className="border-t border-dashed border-gray-300 py-3 flex justify-between text-gray-500 text-[10px] uppercase tracking-wider">
          <div>
            <p className="mb-0.5">Date: {data.date}</p>
            <p>Time: {data.time}</p>
          </div>
          <div className="text-right">
            <p className="mb-0.5">TX: {data.txId}</p>
            <p>Cashier: {data.cashierName}</p>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-300 py-4 flex flex-col gap-3">
          {data.items.map((item, idx) => {
            const { baseName, variants } = parseItemName(item.name);
            return (
              <div key={idx}>
                <div className="flex justify-between font-bold text-[12px] text-[#1a1f36]">
                  <span>{item.quantity}x {baseName}</span>
                  <span>Rp {item.subTotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-start text-gray-400 text-[10px] pl-4 mt-0.5">
                  <div className="flex flex-col gap-0.5">
                    {variants.map((v, i) => <span key={i}>- {v}</span>)}
                  </div>
                  <span>@Rp {item.price.toLocaleString('id-ID')}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 🔥 TAMPILKAN TAX DAN SERVICE JIKA LEBIH DARI 0 🔥 */}
        <div className="border-t border-dashed border-gray-300 py-3.5 flex flex-col gap-1.5">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>Rp {data.subtotal.toLocaleString('id-ID')}</span>
          </div>
          {!!data.serviceCharge && data.serviceCharge > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Service Charge {data.serviceRate ? `(${data.serviceRate}%)` : ''}</span>
              <span>Rp {data.serviceCharge.toLocaleString('id-ID')}</span>
            </div>
          )}
          {!!data.tax && data.tax > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Tax {data.taxRate ? `(${data.taxRate}%)` : ''}</span>
              <span>Rp {data.tax.toLocaleString('id-ID')}</span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-gray-300 py-3.5 flex justify-between items-center font-black text-[15px] text-[#1a1f36]">
          <span>TOTAL</span>
          <span>Rp {data.total.toLocaleString('id-ID')}</span>
        </div>

        {data.wifiPassword && (
          <div className="border-t border-dashed border-gray-300 pt-3 pb-3">
            <div className="flex flex-col items-center justify-center text-[11px] bg-gray-100/50 py-2.5 rounded-lg border border-gray-200 leading-tight gap-1">
              <div><span className="font-bold">Wi-Fi:</span> {data.wifiName || "Guest_WiFi"}</div>
              <div className="font-bold text-[#6C4E31]">Pass: {data.wifiPassword}</div>
            </div>
          </div>
        )}

        <div className="border-t border-dashed border-gray-300 pt-5 pb-1 text-center flex flex-col gap-1">
          <p className="font-bold text-[12px] text-[#1a1f36] uppercase">PAID - {data.paymentMethod}</p>
          <p className="text-gray-400 text-[10px] mt-2 leading-relaxed whitespace-pre-wrap">
            {data.footerMessage || "Thank you for your visit!"}
          </p>
          
          {/* 🔥 TAMBAHAN: POWERED BY KAFILOO 🔥 */}
          <div className="mt-5 pt-3 border-t border-dashed border-gray-200 w-2/3 mx-auto">
            <p className="text-[9px] text-gray-300 font-bold tracking-widest uppercase">
              Powered by Kafiloo
            </p>
          </div>
        </div>

      </div>

      <div className="absolute bottom-0 left-0 right-0 h-2 bg-repeat-x rotate-180" style={{ backgroundImage: 'radial-gradient(circle at 50% 0, transparent 0, transparent 4px, white 4px)', backgroundSize: '12px 12px' }}></div>
    </div>
  );
}