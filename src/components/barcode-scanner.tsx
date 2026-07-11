"use client";

import { useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BarcodeScanner({
  name,
  label = "IMEI / codigo",
  value: controlledValue,
  onValueChange
}: {
  name: string;
  label?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [internalValue, setInternalValue] = useState("");
  const [active, setActive] = useState(false);
  const value = controlledValue ?? internalValue;

  function setValue(next: string) {
    if (onValueChange) onValueChange(next);
    else setInternalValue(next);
  }

  async function scan() {
    setActive(true);
    const reader = new BrowserMultiFormatReader();
    const devices = await BrowserMultiFormatReader.listVideoInputDevices();
    const deviceId = devices[0]?.deviceId;
    const controls = await reader.decodeFromVideoDevice(deviceId, videoRef.current!, (result) => {
      if (result) {
        setValue(result.getText());
        controls.stop();
        setActive(false);
      }
    });
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Input name={name} value={value} onChange={(event) => setValue(event.target.value)} placeholder="Escanear o ingresar manualmente" />
        <Button type="button" onClick={scan}>Camara</Button>
      </div>
      {active ? <video ref={videoRef} className="aspect-video w-full rounded-md bg-black" /> : null}
    </div>
  );
}
