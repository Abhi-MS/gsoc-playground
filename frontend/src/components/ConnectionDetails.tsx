"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  InterfaceEdge,
  InterfaceNode,
  Mac,
  MacPorts,
  MacsEdge,
} from "../types/graphql/GetDeviceInterfaces";
import { DeviceNode } from "../types/graphql/GetZoneDevices";

type DeviceResponse = {
  device: DeviceNode | null;
};

// GraphQL query to fetch device interface details
const QUERY = `
  query Device($id: ID!) {
    device(id: $id) {
      l1interfaces {
        edges {
          node {
            idxL1interface
            idxDevice
            ifname
            nativevlan
            ifoperstatus
            tsIdle
            ifspeed
            duplex
            ifalias
            trunk
            cdpcachedeviceid
            cdpcachedeviceport
            cdpcacheplatform
            lldpremportdesc
            lldpremsysname
            lldpremsysdesc
            lldpremsyscapenabled
            macports{
              edges{
                node{
                  macs{
                    mac
                    oui{
                      organization
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

function ConnectionDetails({ deviceId }: { deviceId?: string }) {
  const params = useParams();
  // Determine device ID from props or URL params
  const id =
    deviceId ??
    (typeof params?.id === "string"
      ? decodeURIComponent(params.id)
      : Array.isArray(params?.id) && params.id.length > 0
      ? decodeURIComponent(params.id[0])
      : undefined);

  const [data, setData] = useState<DeviceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Helper functions for MAC address processing
  const extractMacAddresses = (macports?: MacPorts): string => {
    if (!Array.isArray(macports?.edges) || macports.edges.length === 0)
      return "";

    return macports.edges
      .flatMap((edge) => {
        const macs = edge?.node?.macs;
        const macList = Array.isArray(macs) ? macs : macs ? [macs] : [];
        return macList.map((macObj) => macObj?.mac).filter(Boolean);
      })
      .join(", ");
  };

  const extractManufacturers = (macports?: MacPorts): string => {
    if (!Array.isArray(macports?.edges) || macports.edges.length === 0)
      return "";

    return macports.edges
      .flatMap((edge) => {
        const macs = edge?.node?.macs;
        const macList = Array.isArray(macs) ? macs : macs ? [macs] : [];
        return macList
          .map((macObj) => macObj?.oui?.organization || "")
          .filter(Boolean);
      })
      .join(", ");
  };

  // Fetch device data when ID changes
  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);
    const globalId = id && typeof id === "string" ? btoa(`Device:${id}`) : id;

    fetch("http://localhost:7000/switchmap/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { id: globalId },
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Network error: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json.errors) throw new Error(json.errors[0].message);
        setData(json.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Handle loading, error, and missing data states
  if (!id) return <p>Error: No device ID provided.</p>;
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!data) return null;
  if (!data.device || !data.device.l1interfaces)
    return <p>No interface data available.</p>;

  // Extract interface list
  const interfaces = data.device.l1interfaces.edges.map(
    ({ node }: InterfaceEdge) => node
  );

  return (
    <div className="w-[87%] h-[80vh]">
      <h2 className="mb-4">Connection Details</h2>
      <div className="w-full h-full overflow-auto border border-border rounded-lg shadow-sm">
        <table
          className="w-full h-full border border-border rounded-lg shadow-sm"
          style={{ marginTop: "0rem" }}
        >
          <thead>
            <tr className="sticky top-0 bg-bg z-10">
              {[
                "Port",
                "VLAN",
                "State",
                "Days Inactive",
                "Speed",
                "Duplex",
                "Port Label",
                "Trunk",
                "CDP",
                "LLDP",
                "Mac Address",
                "Manufacturer",
                "IP Address",
                "DNS Name",
              ].map((title) => (
                <th key={title}>{title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {interfaces.map((iface: InterfaceNode) => (
              <tr
                key={iface.idxDevice + iface.ifname}
                className={`
                  ${
                    iface.ifoperstatus === 1
                      ? "bg-[#0072B2]/10 dark:bg-[#56B4E9]/10"
                      : iface.ifoperstatus === 2
                      ? "bg-[#E69F00]/10 dark:bg-[#F0E442]/10"
                      : "bg-gray-100/10 dark:bg-gray-700/10"
                  }
                  transition-colors duration-300
  `}
              >
                <td>{iface.ifname || "N/A"}</td>
                <td>{iface.nativevlan ?? "N/A"}</td>
                <td>
                  {iface.ifoperstatus == 1
                    ? "Active"
                    : iface.ifoperstatus == 2
                    ? "Disabled"
                    : "N/A"}
                </td>
                <td>{iface.tsIdle ?? "N/A"}</td>
                <td>{iface.ifspeed ?? "N/A"}</td>
                <td>{iface.duplex ?? "N/A"}</td>
                <td>{iface.ifalias || "N/A"}</td>
                <td>{iface.trunk ? "Trunk" : "-"}</td>
                <td>
                  {iface.cdpcachedeviceid ? (
                    <>
                      <div>{iface.cdpcachedeviceid}</div>
                      <div>{iface.cdpcachedeviceport}</div>
                    </>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {iface.lldpremsysname ? (
                    <>
                      <div>{iface.lldpremsysname}</div>
                      <div>{iface.lldpremportdesc}</div>
                    </>
                  ) : (
                    "-"
                  )}
                </td>

                {/* Render MAC addresses */}
                <td>{extractMacAddresses(iface.macports)}</td>
                {/* Render MAC manufacturers */}
                <td>{extractManufacturers(iface.macports)}</td>
                {/* Placeholders for IP Address and DNS Name */}
                <td></td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ConnectionDetails;
