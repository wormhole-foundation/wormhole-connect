import { CheckCircle, CircleOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Typography,
} from "@mui/material";
import { ROUTES, RouteInfo } from "../consts";
import { useCallback } from "react";

export default function RouteCard({
  route,
  selected,
  setRoutes,
}: {
  route: RouteInfo;
  selected: boolean;
  setRoutes: React.Dispatch<React.SetStateAction<string[] | undefined>>;
}) {
  const handleClick = useCallback(() => {
    setRoutes((routes) => {
      const effectiveRoutes = routes || ROUTES;
      console.log(effectiveRoutes);
      return effectiveRoutes.includes(route.key)
        ? effectiveRoutes.filter((r) => r !== route.key)
        : [...effectiveRoutes, route.key].sort();
    });
  }, [route, setRoutes]);
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: 1,
        borderColor: selected ? "success.main" : "background.paper",
      }}
    >
      <CardActionArea
        onClick={handleClick}
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 1 }}>
          <Box sx={{ display: "flex" }}>
            <Box sx={{ mr: 0.5, mt: "3px" }}>
              {selected ? <CheckCircle color="success" /> : <CircleOutlined />}
            </Box>
            <Box>
              <Typography variant="h6" gutterBottom>
                {route.title}
              </Typography>
              <Typography>{route.description}</Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
      {route.link ? (
        <CardActions sx={{ ml: 2.5 }}>
          <Button href={route.link} target="_blank">
            Learn More
          </Button>
        </CardActions>
      ) : null}
    </Card>
  );
}
