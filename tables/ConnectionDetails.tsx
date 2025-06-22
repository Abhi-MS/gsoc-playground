import { gql, useQuery } from "@apollo/client";
import { useParams } from "next/navigation";

const GET_DEVICE_INTERFACES = gql`
  query Device($id: ID!) {
    device(id: $id) {
      l1interfaces {
        edges {
          node {
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
          }
        }
      }
    }
  }
`;

function ConnectionDetails({ deviceId }: { deviceId: string }) {
  const { loading, error, data } = useQuery(GET_DEVICE_INTERFACES, {
    variables: { id: deviceId },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  type InterfaceNode = {
    idxDevice: any;
    ifname: any;
    nativevlan: any;
    ifoperstatus: any;
    tsIdle: any;
    ifspeed: any;
    duplex: any;
    ifalias: any;
    trunk: any;
    cdpcachedeviceid: any;
    cdpcachedeviceport?: any;
    cdpcacheplatform?: any;
    lldpremportdesc?: any;
    lldpremsysname?: any;
    lldpremsysdesc?: any;
    lldpremsyscapenabled?: any;
  };

  type DeviceInterfacesData = {
    device: {
      l1interfaces: {
        edges: { node: InterfaceNode }[];
      };
    };
  };

  const interfaces = (
    data as DeviceInterfacesData
  ).device.l1interfaces.edges.map(({ node }) => node);

  return (
    <table>
      <thead>
        <tr>
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
          <tr key={iface.idxDevice + iface.ifname}>
            <td>{iface.ifname || "N/A"}</td>
            <td>{iface.nativevlan ?? "N/A"}</td>
            <td>{iface.ifoperstatus ?? "N/A"}</td>
            <td>{iface.tsIdle ?? "N/A"}</td>
            <td>{iface.ifspeed ?? "N/A"}</td>
            <td>{iface.duplex ?? "N/A"}</td>
            <td>{iface.ifalias || "N/A"}</td>
            <td>{iface.trunk ? "Yes" : "No"}</td>
            <td>{iface.cdpcachedeviceid || ""}</td>
            <td>{iface.lldpremportdesc || ""}</td>
            {/* For Mac Address, Manufacturer, IP, DNS — fetch separately*/}
            <td>{"—"}</td>
            <td>{"—"}</td>
            <td>{"—"}</td>
            <td>{"—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ConnectionDetails;
