import { ctrlWrapper } from "../helpers/ctrlWrapper.js";
import { servicesServices } from "../services/servicesServices.js";

const getServices = async (req, res) => {
  const { total, services } = await servicesServices.getServices(
    req.query,
    req.user
  );
  res.status(200).json({ data: { total, services } });
};

const getServiceById = async (req, res) => {
  const { serviceId } = req.params;
  const service = await servicesServices.getServiceById(serviceId, req.user);
  res.status(200).json({ data: { service } });
};

const getPopularServices = async (req, res) => {
  const { page, limit } = req.query;
  const { total, popularServices } = await servicesServices.getPopularServices({
    page,
    limit,
  });
  res.status(200).json({ data: { popularServices, total } });
};

const getFavoriteServices = async (req, res) => {
  const { id: userId } = req.user;
  const { page, limit } = req.query;

  const { favoriteServices, total } =
    await servicesServices.getUserFavoriteServices(userId, {
      page,
      limit,
    });

  res.status(200).json({ data: { favoriteServices, total } });
};

const addFavoriteService = async (req, res) => {
  const { id: userId } = req.user;
  const { serviceId } = req.params;

  await servicesServices.addFavorite({ userId, serviceId });

  res.status(200).json({ data: { message: "Service added to favorites" } });
};

const removeFavoriteService = async (req, res) => {
  const { id: userId } = req.user;
  const { serviceId } = req.params;

  await servicesServices.removeFavorite({ userId, serviceId });

  res.status(200).json({ data: { message: "Service removed from favorites" } });
};

const createService = async (req, res) => {
  const service = await servicesServices.createService({
    body: req.body,
    file: req.file,
    user: req.user,
  });
  res.status(201).json({ data: { service } });
};

const updateService = async (req, res) => {
  const service = await servicesServices.updateService({
    serviceId: req.params.serviceId,
    body: req.body,
    file: req.file,
    user: req.user,
  });
  res.status(200).json({ data: { service } });
};

const deleteServiceById = async (req, res) => {
  await servicesServices.deleteServiceById(req.params.serviceId, req.user);
  res.status(204).send();
};

export const servicesControllers = {
  getServices: ctrlWrapper(getServices),
  getServiceById: ctrlWrapper(getServiceById),
  getPopularServices: ctrlWrapper(getPopularServices),
  getFavoriteServices: ctrlWrapper(getFavoriteServices),
  addFavoriteService: ctrlWrapper(addFavoriteService),
  removeFavoriteService: ctrlWrapper(removeFavoriteService),
  createService: ctrlWrapper(createService),
  updateService: ctrlWrapper(updateService),
  deleteServiceById: ctrlWrapper(deleteServiceById),
};
