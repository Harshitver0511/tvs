import Link from "next/link";

// Precached by the service worker; shown when a page isn't available offline.
// Bilingual on purpose: it must work without loading the language settings.
export const metadata = { title: "Offline — TVS Credit" };

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-6 space-y-4" style={{ border: "4px solid #000", boxShadow: "8px 8px 0 #000" }}>
        <div className="text-4xl" aria-hidden>📶</div>
        <h1 className="text-2xl font-black uppercase">You are offline</h1>
        <p className="text-lg font-bold">आप ऑफ़लाइन हैं</p>
        <p className="text-sm">
          Your loan application form is saved on this phone. Anything you submitted while offline will be sent
          automatically when the network returns.
        </p>
        <p className="text-sm">
          आपका ऋण आवेदन फ़ॉर्म इस फ़ोन में सुरक्षित है। ऑफ़लाइन रहते हुए जमा किया गया आवेदन नेटवर्क आने पर अपने आप भेज दिया जाएगा।
        </p>
        <Link
          href="/apply"
          className="block text-center font-black uppercase py-3 bg-[#FFD152] text-black no-underline"
          style={{ border: "3px solid #000", minHeight: 48 }}
        >
          Open my application / मेरा आवेदन खोलें
        </Link>
      </div>
    </main>
  );
}
