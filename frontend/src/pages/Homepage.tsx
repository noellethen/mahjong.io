import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Homepage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex flex-col space-y-4 w-40">
        <button
          onClick={() => navigate("/gamemode")}
          className="w-full rounded-md border px-4 py-2"
        >
          Play
        </button>

        <button
          onClick={() => navigate("/shop")}
          className="w-full rounded-md border px-4 py-2"
        >
          Shop
        </button>

        <button
          onClick={() => navigate("/customise")}
          className="w-full rounded-md border px-4 py-2"
        >
          Customise
        </button>
      </div>
    </div>
  );
}

export default Homepage;
